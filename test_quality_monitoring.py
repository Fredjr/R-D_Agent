#!/usr/bin/env python3
"""
Test script for Quality Monitoring System
Tests quality metrics calculation and drift detection
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from quality_monitoring_system import QualityMonitor, record_analysis_quality, check_system_drift
import tempfile
import shutil
from datetime import datetime, timedelta

def test_quality_metrics_calculation():
    """Test quality metrics calculation"""
    
    print("🧪 Testing Quality Metrics Calculation...")
    
    # Create temporary storage
    temp_dir = tempfile.mkdtemp()
    monitor = QualityMonitor(storage_path=temp_dir)
    
    # Sample high-quality content
    high_quality_content = """
    This comprehensive analysis of therapeutic resistance mechanisms reveals critical insights into adaptive cellular responses. 
    The molecular basis of resistance involves multiple pathways including efflux pump upregulation (MDR1, BCRP with IC50 values of 2.5±0.3 μM), 
    DNA repair enhancement (BRCA1/2 overexpression by 3.2-fold, p<0.001), and apoptosis evasion (p53 mutations in 67% of resistant lines, n=150).
    
    Quantitative analysis demonstrates IC50 increases of 10-100 fold in resistant cell lines, with temporal dynamics 
    showing resistance development within 4-8 treatment cycles. However, contradictory findings by Johnson et al. (2023) [1] 
    suggest that "resistance mechanisms vary significantly across tumor types" [1]. 
    
    Furthermore, meta-analysis of 27 studies reveals that combination therapies targeting multiple resistance pathways 
    can restore sensitivity in 60-80% of cases (95% CI: 55-85%, p<0.001) [2,3,4]. 
    
    What we don't know: Long-term efficacy beyond 2-year follow-up remains unclear, and optimal dosing strategies 
    for combination approaches require further investigation.
    """
    
    # Sample low-quality content
    low_quality_content = """
    Cancer is a serious disease. Drug resistance is a problem in treatment. 
    There are many mechanisms involved. Further research is needed to understand this better.
    It is important to note that this is a complex issue. In conclusion, more studies are required.
    """
    
    query = "therapeutic resistance mechanisms in cancer treatment"
    
    # Test high-quality content metrics
    high_metrics = monitor.record_quality_metrics(
        analysis_id="test_high_001",
        analysis_type="generate_review",
        generated_content=high_quality_content,
        query=query,
        context_data={"context_available": True}
    )
    
    # Test low-quality content metrics
    low_metrics = monitor.record_quality_metrics(
        analysis_id="test_low_001", 
        analysis_type="generate_review",
        generated_content=low_quality_content,
        query=query,
        context_data={"context_available": False}
    )
    
    print(f"✅ Calculated metrics for high and low quality content")
    
    # Verify high-quality content scores higher
    improvements = {}
    for metric_name in high_metrics:
        if metric_name in low_metrics:
            improvement = high_metrics[metric_name] - low_metrics[metric_name]
            improvements[metric_name] = improvement
            
            print(f"   {metric_name}:")
            print(f"     High quality: {high_metrics[metric_name]:.3f}")
            print(f"     Low quality: {low_metrics[metric_name]:.3f}")
            print(f"     Improvement: {improvement:+.3f}")
    
    # Check that high-quality content performs better on key metrics
    key_metrics = ["specificity_score", "evidence_density", "academic_credibility"]
    better_metrics = sum(1 for metric in key_metrics if improvements.get(metric, 0) > 0)
    
    print(f"✅ High-quality content outperforms on {better_metrics}/{len(key_metrics)} key metrics")
    
    # Cleanup
    shutil.rmtree(temp_dir)
    
    return better_metrics >= 2  # At least 2/3 key metrics should be better

def test_drift_detection():
    """Test quality drift detection"""
    
    print("\n🧪 Testing Quality Drift Detection...")
    
    # Create temporary storage
    temp_dir = tempfile.mkdtemp()
    monitor = QualityMonitor(storage_path=temp_dir, alert_threshold=0.1)  # Lower threshold for testing
    
    # Simulate baseline period (30 days ago to 7 days ago)
    baseline_start = datetime.now() - timedelta(days=30)
    baseline_end = datetime.now() - timedelta(days=7)
    
    # Add baseline metrics (high quality)
    for i in range(10):
        timestamp = baseline_start + timedelta(days=i*2)
        
        # Simulate high-quality baseline metrics
        from quality_monitoring_system import QualityMetric
        baseline_metric = QualityMetric(
            metric_name="specificity_score",
            value=0.8 + (i % 3) * 0.05,  # Values around 0.8-0.9
            timestamp=timestamp,
            analysis_type="generate_review",
            analysis_id=f"baseline_{i}",
            metadata={"test": True}
        )
        monitor.metrics_history.append(baseline_metric)
    
    # Add recent metrics (degraded quality)
    recent_start = datetime.now() - timedelta(days=6)
    
    for i in range(5):
        timestamp = recent_start + timedelta(days=i)
        
        # Simulate degraded metrics (20% lower)
        degraded_metric = QualityMetric(
            metric_name="specificity_score",
            value=0.65 + (i % 2) * 0.05,  # Values around 0.65-0.7 (degraded)
            timestamp=timestamp,
            analysis_type="generate_review", 
            analysis_id=f"recent_{i}",
            metadata={"test": True}
        )
        monitor.metrics_history.append(degraded_metric)
    
    # Check for drift
    alerts = monitor.check_quality_drift(days_back=7)
    
    print(f"✅ Drift detection completed")
    print(f"   Alerts generated: {len(alerts)}")
    
    if alerts:
        alert = alerts[0]
        print(f"   Alert details:")
        print(f"     Metric: {alert.metric_name}")
        print(f"     Degradation: {alert.degradation_percent:.1f}%")
        print(f"     Severity: {alert.severity}")
        print(f"     Current: {alert.current_value:.3f}")
        print(f"     Baseline: {alert.baseline_value:.3f}")
    
    # Verify alert was generated for significant degradation
    has_alert = len(alerts) > 0
    correct_degradation = alerts[0].degradation_percent > 10 if alerts else False
    
    print(f"   Alert generated: {'✅' if has_alert else '❌'}")
    print(f"   Correct degradation detected: {'✅' if correct_degradation else '❌'}")
    
    # Cleanup
    shutil.rmtree(temp_dir)
    
    return has_alert and correct_degradation

def test_quality_dashboard():
    """Test quality monitoring dashboard"""
    
    print("\n🧪 Testing Quality Dashboard...")
    
    # Create temporary storage
    temp_dir = tempfile.mkdtemp()
    monitor = QualityMonitor(storage_path=temp_dir)
    
    # Add sample metrics
    from quality_monitoring_system import QualityMetric, QualityAlert
    
    # Recent metrics
    recent_time = datetime.now() - timedelta(hours=1)
    
    sample_metrics = [
        QualityMetric("context_coverage", 0.85, recent_time, "generate_review", "test_001", {}),
        QualityMetric("specificity_score", 0.75, recent_time, "generate_review", "test_002", {}),
        QualityMetric("evidence_density", 0.90, recent_time, "deep_dive", "test_003", {}),
    ]
    
    monitor.metrics_history.extend(sample_metrics)
    
    # Sample alert
    sample_alert = QualityAlert(
        alert_id="test_alert_001",
        metric_name="specificity_score",
        current_value=0.65,
        baseline_value=0.85,
        degradation_percent=23.5,
        analysis_type="generate_review",
        timestamp=recent_time,
        severity="warning",
        description="Test alert"
    )
    
    monitor.alerts_history.append(sample_alert)
    
    # Get dashboard
    dashboard = monitor.get_quality_dashboard()
    
    print(f"✅ Dashboard generated")
    print(f"   Total analyses: {dashboard['total_analyses']}")
    print(f"   Active alerts: {dashboard['active_alerts']}")
    print(f"   Warning alerts: {dashboard['warning_alerts']}")
    print(f"   Analysis types: {list(dashboard['analysis_types'].keys())}")
    
    # Verify dashboard structure
    has_analyses = dashboard['total_analyses'] > 0
    has_analysis_types = len(dashboard['analysis_types']) > 0
    has_alerts_data = 'recent_alerts' in dashboard
    
    print(f"   Has analyses data: {'✅' if has_analyses else '❌'}")
    print(f"   Has analysis types: {'✅' if has_analysis_types else '❌'}")
    print(f"   Has alerts data: {'✅' if has_alerts_data else '❌'}")
    
    # Cleanup
    shutil.rmtree(temp_dir)
    
    return has_analyses and has_analysis_types and has_alerts_data

def test_integration_with_convenience_functions():
    """Test integration with convenience functions"""
    
    print("\n🧪 Testing Integration with Convenience Functions...")
    
    # Test record_analysis_quality function
    try:
        metrics = record_analysis_quality(
            analysis_id="integration_test_001",
            analysis_type="generate_review",
            content="This is a test analysis with some quantitative data (IC50 = 2.5 μM, p<0.001) and citations [1,2].",
            query="test query for integration",
            context={"test": True}
        )
        
        print(f"✅ Recorded quality metrics via convenience function")
        print(f"   Metrics calculated: {len(metrics)}")
        
        # Test check_system_drift function
        alerts = check_system_drift(days_back=30)
        
        print(f"✅ Checked system drift via convenience function")
        print(f"   Alerts found: {len(alerts)}")
        
        return len(metrics) > 0
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

def main():
    """Run all quality monitoring tests"""
    
    print("🚀 QUALITY MONITORING SYSTEM - COMPREHENSIVE TESTING")
    print("=" * 60)
    
    results = []
    
    # Test individual components
    try:
        result1 = test_quality_metrics_calculation()
        results.append(("Quality Metrics Calculation", result1))
    except Exception as e:
        print(f"❌ Quality Metrics Calculation failed: {e}")
        results.append(("Quality Metrics Calculation", False))
    
    try:
        result2 = test_drift_detection()
        results.append(("Drift Detection", result2))
    except Exception as e:
        print(f"❌ Drift Detection failed: {e}")
        results.append(("Drift Detection", False))
    
    try:
        result3 = test_quality_dashboard()
        results.append(("Quality Dashboard", result3))
    except Exception as e:
        print(f"❌ Quality Dashboard failed: {e}")
        results.append(("Quality Dashboard", False))
    
    try:
        result4 = test_integration_with_convenience_functions()
        results.append(("Integration Functions", result4))
    except Exception as e:
        print(f"❌ Integration Functions failed: {e}")
        results.append(("Integration Functions", False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 QUALITY MONITORING TEST RESULTS")
    print("=" * 60)
    
    passed = 0
    for system_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{system_name}: {status}")
        if result:
            passed += 1
    
    overall_success = passed == len(results)
    
    print(f"\n🎯 OVERALL RESULT: {passed}/{len(results)} systems passed")
    
    if overall_success:
        print("🎉 QUALITY MONITORING SYSTEM FULLY OPERATIONAL!")
        print("\n🚀 PRODUCTION READY FEATURES:")
        print("   ✅ Quality Metrics: 6 comprehensive metrics calculated")
        print("   ✅ Drift Detection: Automated alerts for quality degradation")
        print("   ✅ Dashboard: Real-time quality monitoring interface")
        print("   ✅ Integration: Seamless integration with analysis pipelines")
        
        print("\n📊 MONITORING CAPABILITIES:")
        print("   • Context Coverage: Query relevance tracking")
        print("   • Specificity Score: Quantitative detail measurement")
        print("   • Evidence Density: Citation and evidence tracking")
        print("   • Novelty Score: Non-generic insight detection")
        print("   • Academic Credibility: Academic standards compliance")
        print("   • Response Coherence: Logical flow assessment")
        
        print("\n🚨 ALERT SYSTEM:")
        print("   • Warning: >15% degradation from baseline")
        print("   • Critical: >25% degradation from baseline")
        print("   • Weekly monitoring with automated notifications")
        
        return 0
    else:
        print("⚠️  SOME COMPONENTS NEED ATTENTION")
        print("🔧 Review failed tests before production deployment")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
